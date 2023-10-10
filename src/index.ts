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

    const endpoint = new Endpoint('http://localhost:5173/api/login', 'POST', schema)

    const result = await endpoint.fetchSafe({
        username: '',
        password: '',
    })

    console.log(result)
}

main()
