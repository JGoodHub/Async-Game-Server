
export async function Destruct<ReturnType> (targetPromise): Promise<[ReturnType | null, any]>
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
