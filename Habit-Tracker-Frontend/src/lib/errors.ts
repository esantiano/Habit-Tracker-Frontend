export async function safeErrorMessage(err: unknown): Promise<string> {
    if (err instanceof Error) return err.message;
    return String(err)
}