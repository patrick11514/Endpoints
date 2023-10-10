# Endpoints

Small library for creating endpoints and executing fetch requests to them using Zod type safety.

## Usage

```TS
import { Endpoint } from "@patrick115/endpoints"
import z from "zod"

//schema for the response
const schema = z.object({
    status: z.literal(true),
    data: z.object({
        id: z.number(),
        name: z.string(),
    })
})

//creating endpoint
const endpoint = new Endpoint("/api/path/to/endpoint", "POST", {
    username: "patrick115",
    password: "example123",
}, schema)

//fetch endpoint and return Promise, that can be fullfilled with our data, or rejected with error
endpoint.fetch()

/*
fetch endpoint and return object
{
    status: true,
    data: {
        id: 1,
        name: "patrick115"
    }
}
or if api sends error, which match error schema, it will return
{
    status: true,
    errorSchema: true,
    data: {
        //error from api
        status: false,
        error: "Invalid password"
    }
}
or if fetch fails
{
    status: false,
    error: "Text error" // or error can be object
}
*/
endpoint.fetchSafe()
```
