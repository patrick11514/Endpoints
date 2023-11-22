import { z } from 'zod'
import { Endpoint } from './main'

const main = async () => {
    const schema = z.object({
        status: z.literal(true),
        data: z.object({
            id: z.number(),
            username: z.string(),
        }),
    })

    const inputSchema = z.object({
        id: z.number().min(1),
    })

    const endpoint = new Endpoint('http://localhost:5173/api/login', 'POST', schema, inputSchema)

    const result = await endpoint.fetchSafe({
        id: 0,
    })

    console.log(result)
}

main()
