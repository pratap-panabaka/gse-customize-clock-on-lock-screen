import Gio from 'gi://Gio';

/* Gio.Subprocess */
Gio._promisify(Gio.Subprocess.prototype, 'communicate_async');
Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');
Gio._promisify(Gio.Subprocess.prototype, 'wait_async');
Gio._promisify(Gio.Subprocess.prototype, 'wait_check_async');

/* Ancillary Methods */
Gio._promisify(Gio.DataInputStream.prototype, 'read_line_async',
    'read_line_finish_utf8');
Gio._promisify(Gio.OutputStream.prototype, 'write_bytes_async');

/**
 * Execute a command asynchronously and return the output from `stdout` on
 * success or throw an error with output from `stderr` on failure.
 *
 * If given, @input will be passed to `stdin` and @cancellable can be used to
 * stop the process before it finishes.
 *
 * @param {string[]} argv - a list of string arguments
 * @param {string} [input] - Input to write to `stdin` or %null to ignore
 * @param {Gio.Cancellable} [cancellable] - optional cancellable object
 * @returns {Promise<string>} - The process output
 */
async function execCommunicate(argv, input = null, cancellable = null) {
    let cancelId = 0;
    let flags = Gio.SubprocessFlags.STDOUT_PIPE |
        Gio.SubprocessFlags.STDERR_PIPE;

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    const proc = new Gio.Subprocess({argv, flags});
    proc.init(cancellable);

    if (cancellable instanceof Gio.Cancellable)
        cancelId = cancellable.connect(() => proc.force_exit());

    try {
        const [stdout, stderr] = await proc.communicate_utf8_async(input, null);

        const status = proc.get_exit_status();

        if (status !== 0) {
            throw new Gio.IOErrorEnum({
                code: Gio.IOErrorEnum.FAILED,
                message: stderr ? stderr.trim() : `Command '${argv}' failed with exit code ${status}`,
            });
        }

        return stdout.trim();
    } finally {
        if (cancelId > 0)
            cancellable.disconnect(cancelId);
    }
}

export default execCommunicate;
