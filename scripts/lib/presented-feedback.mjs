import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";

// CDP calls these frame-swap timestamps, not requestAnimationFrame callbacks:
// https://chromedevtools.github.io/devtools-protocol/tot/Page/#type-ScreencastFrameMetadata
// A consumer must choose a feedback patch with no unrelated animation/caret,
// settle pointer/focus preparation, and verify the intended product outcome.
export async function measurePresentedFeedback(page, plan) {
  const { directory, label, input, prepare, act, region, verify, settleMs } = plan;
  if (!Number.isFinite(settleMs) || settleMs <= 0) throw Error("Declare capture/reset spacing");
  if (!["pointerdown", "keydown"].includes(input.type)) throw Error("Declare initiating native input");
  const patch = { ...region };
  for (const field of ["x", "y", "width", "height"]) {
    if (!Number.isInteger(patch[field]) || patch[field] < (field === "x" || field === "y" ? 0 : 1)) {
      throw Error(`Invalid feedback patch ${field}`);
    }
  }
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "attempt.json"), JSON.stringify({ label, inputType: input.type, patch }) + "\n", { flag: "wx" });
  const attemptId = await realpath(directory);
  await prepare();
  const viewport = await page.evaluate(() => {
    let previous = performance.now();
    const ticks = [];
    for (let i = 0; i < 20000 && ticks.length < 8; i++) {
      const current = performance.now();
      if (current > previous) { ticks.push(current - previous); previous = current; }
    }
    return { width: innerWidth, height: innerHeight, devicePixelRatio, visualScale: visualViewport?.scale,
      timeOrigin: performance.timeOrigin, observedClockTickMs: ticks.length ? Math.min(...ticks) : undefined };
  });
  const session = await page.context().newCDPSession(page);
  const frames = [], writes = [];
  let frameError, firstFrame;
  const started = new Promise(resolve => { firstFrame = resolve; });
  const onFrame = frame => {
    // Ack before disk/decode work; decode only after the measurement window.
    void session.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(error => { frameError = String(error); });
    const index = frames.length, file = `frame-${String(index).padStart(4, "0")}.png`;
    frames.push({ file, ...frame.metadata });
    writes.push(writeFile(join(directory, file), Buffer.from(frame.data, "base64")).catch(error => { frameError = String(error); }));
    firstFrame();
  };
  session.on("Page.screencastFrame", onFrame);
  let inputs = [], outcome = false, captureError, finalViewport;
  try {
    await input.target.evaluate((element, type) => {
      window.__tangleFeedbackInputs = [];
      const observer = event => {
        if (!event.isTrusted || !element.contains(event.target)) return;
        window.__tangleFeedbackInputs.push({
          type: event.type, trusted: event.isTrusted,
          inputEpochMs: performance.timeOrigin + event.timeStamp,
          observerHandlerEpochMs: performance.timeOrigin + performance.now(),
          key: event.key, pointerType: event.pointerType,
        });
      };
      window.addEventListener(type, observer, true);
      window.__tangleFeedbackStop = () => window.removeEventListener(type, observer, true);
    }, input.type);
    await session.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    let baselineTimer;
    try {
      await Promise.race([started, new Promise((_, reject) => { baselineTimer = setTimeout(() => reject(Error("No baseline frame")), 3000); })]);
    } finally { clearTimeout(baselineTimer); }
    await act();
    await page.waitForTimeout(settleMs);
    outcome = await verify();
  } catch (error) {
    captureError = String(error?.stack ?? error);
  } finally {
    let inputReadTimer;
    try {
      const retained = await Promise.race([
        page.evaluate(() => {
          window.__tangleFeedbackStop?.();
          return { inputs: window.__tangleFeedbackInputs ?? [],
            viewport: { width: innerWidth, height: innerHeight, devicePixelRatio, visualScale: visualViewport?.scale } };
        }),
        new Promise((_, reject) => { inputReadTimer = setTimeout(() => reject(Error("Input-observer cleanup timed out")), 1000); }),
      ]);
      inputs = retained.inputs;
      finalViewport = retained.viewport;
    } catch (error) { captureError ??= String(error?.stack ?? error); }
    finally { clearTimeout(inputReadTimer); }
    await session.send("Page.stopScreencast").catch(error => { frameError = String(error); });
    session.off("Page.screencastFrame", onFrame);
    await Promise.all(writes);
    await session.detach();
  }
  const observation = { attemptId, label, patch, viewport, finalViewport, inputType: input.type, inputs, outcome, frames, captureError, frameError,
    handlerMeaning: "Capture listener start; application handler start is not inferred",
    clock: "Browser input epoch and CDP image frame-swap epoch", spacingMs: settleMs };
  if (captureError || frameError || inputs.length !== 1 || !outcome) {
    observation.status = "FAIL";
    observation.reason = captureError || frameError || (inputs.length !== 1 ? "Expected exactly one trusted initiating input" : "Intended outcome failed");
  } else {
    try {
      Object.assign(observation, await analyzeFrames(page, directory, frames, patch, viewport, finalViewport, inputs[0].inputEpochMs));
    } catch (error) {
      Object.assign(observation, { status: "UNCHECKED", reason: "Frame analysis failed", analysisError: String(error?.stack ?? error) });
    }
  }
  await writeFile(join(directory, "observation.json"), JSON.stringify(observation, null, 2) + "\n");
  return observation;
}

async function analyzeFrames(page, directory, frames, patch, viewport, finalViewport, inputEpochMs) {
  if (frames.some(frame => !Number.isFinite(frame.timestamp))) {
    return { status: "UNCHECKED", reason: "Frame-swap timestamp absent" };
  }
  if (frames.some(frame => frame.offsetTop !== 0)) {
    return { status: "UNCHECKED", reason: "Nonzero browser inset has no verified patch mapping" };
  }
  if (viewport.visualScale !== 1 || finalViewport.visualScale !== 1 || frames.some(frame => frame.pageScaleFactor !== 1)) {
    return { status: "UNCHECKED", reason: "Visual/page zoom has no verified feedback-patch mapping" };
  }
  if (["width", "height", "devicePixelRatio"].some(field => viewport[field] !== finalViewport[field])) {
    return { status: "UNCHECKED", reason: "Viewport changed during input" };
  }
  if (!Number.isFinite(viewport.observedClockTickMs)) {
    return { status: "UNCHECKED", reason: "Browser timestamp quantization not observed" };
  }
  const samples = [];
  for (const frame of frames) {
    const encoded = (await readFile(join(directory, frame.file))).toString("base64");
    const decoded = await page.evaluate(async ({ encoded, patch, viewport }) => {
      const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const scaleX = bitmap.width / viewport.width, scaleY = bitmap.height / viewport.height;
      const imagePatch = { x: Math.floor(patch.x * scaleX), y: Math.floor(patch.y * scaleY),
        width: Math.max(1, Math.floor(patch.width * scaleX)), height: Math.max(1, Math.floor(patch.height * scaleY)) };
      if (imagePatch.x + imagePatch.width > bitmap.width || imagePatch.y + imagePatch.height > bitmap.height) throw Error("Feedback patch outside captured frame");
      const canvas = new OffscreenCanvas(imagePatch.width, imagePatch.height), context = canvas.getContext("2d");
      context.drawImage(bitmap, imagePatch.x, imagePatch.y, imagePatch.width, imagePatch.height, 0, 0, imagePatch.width, imagePatch.height);
      bitmap.close();
      return { imagePatch, scaleX, scaleY, pixels: [...context.getImageData(0, 0, imagePatch.width, imagePatch.height).data] };
    }, { encoded, patch, viewport });
    samples.push({ file: frame.file, epochMs: frame.timestamp * 1000, ...decoded });
  }
  const before = samples.filter(sample => sample.epochMs <= inputEpochMs);
  if (!before.length) return { status: "UNCHECKED", reason: "No frame precedes input", samples };
  const baseline = before.at(-1);
  if (samples.some(sample => sample.scaleX !== baseline.scaleX || sample.scaleY !== baseline.scaleY)) {
    return { status: "UNCHECKED", reason: "Capture geometry changed during input", samples };
  }
  const differs = sample => sample.pixels.some((value, index) => value !== baseline.pixels[index]);
  if (before.some(differs)) return { status: "UNCHECKED", reason: "Feedback patch changed during preparation", samples };
  const changed = samples.find(sample => sample.epochMs > inputEpochMs && differs(sample));
  if (!changed) return { status: "FAIL", reason: "No captured feedback change after input", samples };
  const preceding = samples.filter(sample => sample.epochMs < changed.epochMs && !differs(sample)).at(-1);
  const intervals = samples.slice(1).map((sample, index) => sample.epochMs - samples[index].epochMs);
  if (intervals.some(interval => interval <= 0)) return { status: "UNCHECKED", reason: "Frame timestamps not strictly increasing", samples };
  const numericEpochQuantumMs = Number.EPSILON * Math.abs(inputEpochMs) * 2;
  const timestampUncertaintyMs = viewport.observedClockTickMs * 2 + numericEpochQuantumMs;
  return { status: "OBSERVED", firstFeedbackFrame: changed.file, previousUnchangedFrame: preceding.file,
    latencyLowerMs: Math.max(0, preceding.epochMs - inputEpochMs - timestampUncertaintyMs),
    latencyUpperMs: changed.epochMs - inputEpochMs + timestampUncertaintyMs,
    timestampUncertaintyMs, numericEpochQuantumMs, observedBrowserTickMs: viewport.observedClockTickMs,
    captureFrameIntervalsMs: intervals, timestampUnit: "CDP seconds converted to milliseconds; input milliseconds",
    detector: "First captured pixel change in the consumer-declared relevant-control feedback patch; inspect original images",
    samples };
}

export function summarizeFeedbackBatches(batches, budgetMs) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) throw Error("Read the feedback budget from installed Brand roles");
  const nearest = (values, percentile) => [...values].sort((a, b) => a - b)[Math.ceil(percentile * values.length) - 1];
  return batches.map(batch => {
    const rows = batch.samples, observed = rows.filter(row => row.status === "OBSERVED");
    const result = { ...batch, budgetMs, attempted: rows.length, failures: rows.filter(row => row.status === "FAIL").length,
      unchecked: rows.filter(row => row.status !== "FAIL" && row.status !== "OBSERVED").length };
    const siblings = batches.filter(other => other.condition === batch.condition && other.temperature === batch.temperature);
    const allRows = siblings.flatMap(other => other.samples), ids = allRows.map(row => row.attemptId);
    const epochs = allRows.map(row => row.inputs?.length === 1 ? row.inputs[0].inputEpochMs : undefined);
    if (ids.some(id => !id) || epochs.some(epoch => !Number.isFinite(epoch))) {
      return { ...result, status: "UNCHECKED", reason: "Native input/attempt identities absent" };
    }
    if (new Set(ids).size !== ids.length || new Set(epochs).size !== epochs.length) {
      return { ...result, status: "FAIL", reason: "Repeated attempt/input identities cannot count as another batch" };
    }
    if (epochs.some((epoch, index) => index > 0 && epoch <= epochs[index - 1])) {
      return { ...result, status: "UNCHECKED", reason: "Attempt order is not consecutive by native input start" };
    }
    if (!batch.condition || !["cold", "warm"].includes(batch.temperature) || siblings.length !== 2 || allRows.length !== 80 || rows.length !== 40 || observed.length !== 40 || !batch.calibration?.pass) {
      return { ...result, status: result.failures ? "FAIL" : "UNCHECKED", reason: "Require two40-observation batches per declared condition/temperature and valid calibration; no silent exclusions" };
    }
    const lower = observed.map(row => row.latencyLowerMs), upper = observed.map(row => row.latencyUpperMs);
    const statistics = { p50LowerMs: nearest(lower, 0.5), p50UpperMs: nearest(upper, 0.5),
      p95LowerMs: nearest(lower, 0.95), p95UpperMs: nearest(upper, 0.95), maximumUpperMs: Math.max(...upper) };
    return { ...result, statistics, status: statistics.p95UpperMs <= budgetMs ? "PASS" : statistics.p95LowerMs > budgetMs ? "FAIL" : "UNCHECKED" };
  });
}

export async function calibratePresentedFeedback(page, { directory, fixture, delayedMs, spacingMs }) {
  if (!Number.isFinite(delayedMs) || delayedMs <= 0) throw Error("Declare deliberate render delay");
  const observations = [];
  for (const delay of [0, delayedMs]) {
    await page.setContent(fixture);
    await page.evaluate(delay => { window.feedbackCalibrationDelay = delay; }, delay);
    const target = page.getByRole("button", { name: "Delayed feedback fixture" });
    const box = await target.boundingBox();
    const observation = await measurePresentedFeedback(page, {
      directory: join(directory, `delay-${delay}`), label: `deliberate-delay-${delay}`,
      input: { type: "pointerdown", target }, prepare: () => target.hover(), act: () => target.click(),
      region: { x: Math.floor(box.x + 8), y: Math.floor(box.y + 8), width: 4, height: 4 },
      settleMs: spacingMs, verify: () => target.getAttribute("data-feedback").then(value => value === "shown"),
    });
    const application = await page.evaluate(() => window.feedbackCalibration);
    const first = observation.samples?.find(frame => frame.file === observation.firstFeedbackFrame);
    const frameAfterMutation = first ? first.epochMs - application.mutationEpochMs : undefined;
    // A frame before the actual mutation cannot demonstrate its presentation.
    // The delayed control must not be mistaken for immediate handler feedback.
    const pass = observation.status === "OBSERVED" && frameAfterMutation >= 0 && observation.latencyUpperMs >= delay;
    observations.push({ delay, application, frameAfterMutationMs: frameAfterMutation, pass, observation });
  }
  const result = { pass: observations.every(row => row.pass), observations,
    meaning: "Real native input and deliberately delayed DOM rendering; CDP image frame-swap evidence, no rAF latency surrogate" };
  await writeFile(join(directory, "calibration.json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}
