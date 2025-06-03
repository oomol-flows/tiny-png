//#region generated meta
import type { Context } from "@oomol/types/oocana";
type Inputs = {
    args: any;
};
type Outputs = {
    key: string;
    save_address: string | null;
};
//#endregion

export default async function(
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {

    const {key, save_address} = params.args;

    return { key: key, save_address: save_address };
};
