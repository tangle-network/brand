import { schemaRows, type ApiField } from "../lib/code-presentation";
export interface ApiSchemaProps {fields:readonly ApiField[];label?:string;}
/** Presentation only: the consuming API owns all fields and constraints. */
export function ApiSchema({fields,label="Schema"}:ApiSchemaProps) {
 return <dl aria-label={label} className="tangle-api-schema">{schemaRows(fields).map((field,index)=><div key={`${field.path}-${index}`} style={{paddingInlineStart:`${field.depth}rem`}}>
  <dt><code>{field.path}</code> <span>{field.type}{field.required?" · required":""}</span></dt>
  {field.description&&<dd>{field.description}</dd>}
 </div>)}</dl>;
}
