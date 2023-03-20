
export const Destruct = async (targetPromise) =>
{
    try
    {
        const data = await targetPromise;
        return [data, null];
    }
    catch (err)
    {
        console.error(err);
        return [null, err];
    }
}