/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType RESTLet
 */

import * as file from "N/file";

export function get(request) {
    const f = file.load({
        id: request.fileId,
    });
    return JSON.stringify(f);
}
