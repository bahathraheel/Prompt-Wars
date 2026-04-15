const { Logging } = require('@google-cloud/logging');

const logging = new Logging();
const logName = 'exo-stadium-logs';
const log = logging.log(logName);

const logger = {
    info(message, metadata = {}) {
        const entry = log.entry({ resource: { type: 'global' } }, { message, ...metadata, severity: 'INFO' });
        log.write(entry).catch(console.error);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[INFO] ${message}`, metadata);
        }
    },
    error(message, error = {}) {
        const entry = log.entry({ resource: { type: 'global' } }, { message, error: error.message, stack: error.stack, severity: 'ERROR' });
        log.write(entry).catch(console.error);
        console.error(`[ERROR] ${message}`, error);
    },
    warn(message, metadata = {}) {
        const entry = log.entry({ resource: { type: 'global' } }, { message, ...metadata, severity: 'WARNING' });
        log.write(entry).catch(console.error);
        console.warn(`[WARN] ${message}`, metadata);
    }
};

module.exports = logger;
