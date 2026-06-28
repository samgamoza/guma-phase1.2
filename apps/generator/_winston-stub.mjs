const noop = () => {}
const logger = { info: noop, warn: noop, error: noop, debug: noop }
const fmt = () => ({})
fmt.combine = () => ({}); fmt.timestamp = () => ({}); fmt.colorize = () => ({}); fmt.printf = () => ({})
export default { format: fmt, createLogger: () => logger, transports: { Console: class {}, File: class {} } }
