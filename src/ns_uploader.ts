/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType RESTLet
 */

import * as error from "N/error";
import * as log from "N/log";
import * as encode from "N/encode";
import { EntryPoints } from "N/Types";
import { ErrorCodes } from "./nsu_error_codes";
import {FILETYPES} from "./nsu_file_types";

interface IPOSTRequest {
    action: string;
    filepath: string;
    rootpath: string;
    content: string;
}

interface IFileInfo {
    nsfileext: string;
}

interface IPOSTResponse {
    message: string;
    code: number;
}

export function post(request: IPOSTRequest) {
    // routing
    switch (request.action) {
        case "upload":
            return upload(request);
    }
}

function upload(request: IPOSTRequest) {
    const resp: IPOSTResponse = {
        code: 0,
        message: request,
    };
    log.debug("Request was: ", resp);
    return resp;
//    validateRequest(request);
//    const i = pathInfo(request.filepath, request.rootpath, true);
//    const body = request.content;
//    if (~FILETYPES.NON_BIN.indexOf(i.nsfileext)) {

//    }
}

function pathInfo(fullpath: string, baseIn: string, createFolders: boolean) {
    const i: IFileInfo = {
        nsfileext: "zip",
    };
    return i;
}

function validateRequest(request: IPOSTRequest) {
     if (!request.filepath) {
        throw error.create({
            name: ErrorCodes.INVLD_PARAM,
            message: "No file path specified",
        });
    }
     if (!request.rootpath) {
        throw error.create({
            name: ErrorCodes.INVLD_PARAM,
            message: "No destination root path specified",
        });
    }
}
