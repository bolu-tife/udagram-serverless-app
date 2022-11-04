import middy from "@middy/core"
import middyJsonBodyParser from "@middy/http-json-body-parser"

export const middyfy = (handler, options?) => {

  let result =   middy(handler).use(middyJsonBodyParser());
  return (options == undefined) ? result : result.use(options)
}
