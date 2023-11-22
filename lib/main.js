"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.zodErrorSchema = void 0;
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const zod_1 = require("zod");
exports.zodErrorSchema = zod_1.z.custom((value) => {
    if (typeof value === 'undefined')
        return false;
    if (typeof value !== 'object')
        return false;
    if (value === null)
        return false;
    if (!('name' in value))
        return false;
    if (value.name !== 'ZodError')
        return false;
    if (!('issues' in value))
        return false;
    if (typeof value.issues !== 'object')
        return false;
    if (!Array.isArray(value.issues))
        return false;
    return true;
});
class Endpoint {
    endpoint;
    method;
    data;
    schema;
    inputSchema;
    headers;
    constructor(endpoint, method, schema, inputSchema, headers) {
        this.endpoint = endpoint;
        this.method = method;
        this.schema = schema;
        this.headers = headers;
    }
    async fetch(data) {
        if (this.inputSchema) {
            const result = this.inputSchema.safeParse(data);
            if (!result.success) {
                return {
                    status: false,
                    error: result.error,
                };
            }
            this.data = result.data;
        }
        else {
            this.data = data;
        }
        return new Promise(async (resolve, reject) => {
            const result = await this.executeFetch();
            if (result.status === false) {
                reject(result.error);
            }
            else {
                resolve(result.data);
            }
        });
    }
    async fetchSafe(data) {
        if (this.inputSchema) {
            const result = this.inputSchema.safeParse(data);
            if (!result.success) {
                return {
                    status: false,
                    errorSchema: false,
                    error: result.error,
                };
            }
            this.data = result.data;
        }
        else {
            this.data = data;
        }
        const request = await this.executeFetch();
        if (request.status === false) {
            if ('data' in request) {
                return {
                    status: false,
                    errorSchema: false,
                    error: request.error,
                    errorData: request.data,
                };
            }
            else {
                return {
                    status: false,
                    errorSchema: false,
                    error: request.error,
                };
            }
        }
        else {
            if ('handled' in request) {
                return {
                    status: false,
                    errorSchema: true,
                    data: request.data,
                };
            }
            else {
                return {
                    status: true,
                    data: request.data,
                };
            }
        }
    }
    getHeaders() {
        const object = {
            method: this.method,
        };
        if (this.headers) {
            object['headers'] = this.headers;
        }
        switch (typeof this.data) {
            case 'string':
                object['body'] = this.data;
                break;
            case 'object':
                if (this.data instanceof form_data_1.default) {
                    object['body'] = this.data;
                }
                else {
                    object['body'] = JSON.stringify(this.data);
                }
                break;
            case 'undefined':
                break;
            default:
                if (this.data['toString'] !== undefined) {
                    object['body'] = this.data.toString();
                }
                else {
                    throw new Error('Invalid data type');
                }
        }
        return object;
    }
    async executeFetch() {
        const request = await (0, node_fetch_1.default)(this.endpoint, this.getHeaders());
        let json;
        let text = '';
        try {
            text = await request.clone().text();
            json = (await request.json());
        }
        catch (e) {
            return {
                status: false,
                data: text,
                error: e,
            };
        }
        const result = this.parseJson(json);
        return result;
    }
    parseJson(json) {
        const data = this.schema.safeParse(json);
        if (!data.success) {
            const errorSchema = zod_1.z.object({
                status: zod_1.z.literal(false),
                error: exports.zodErrorSchema.or(zod_1.z.string()),
            });
            const error = errorSchema.safeParse(json);
            if (!error.success) {
                console.log(error.error.errors);
                return {
                    status: false,
                    handled: true,
                    error: json,
                };
            }
            else {
                return {
                    status: true,
                    handled: true,
                    data: error.data,
                };
            }
        }
        else {
            return {
                status: true,
                data: data.data,
            };
        }
    }
}
exports.Endpoint = Endpoint;
