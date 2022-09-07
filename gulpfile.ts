/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import { parallel, series } from "gulp";
import del from 'del';
import log from "fancy-log"
import { spawn } from "cross-spawn"
import { execSync } from "child_process";

var semVer: string;

type mode = "development" | "production" | "stage"

interface IExtensionManifestOverride {
    version?: string
}

export function clean() {
    return del([
            'dist/**/*',
            'package/**/*'
        ], 
        { force: true }
    )
}

export function cleanNpm() {
    return del('node_modules/**/*', {force: true})
}

function compile(mode: mode) {
    return spawn('npx', ['webpack', '--mode', mode], {stdio: 'inherit'})
}

export function compile_dev() {    
    return compile("development")
}

export function compile_prod() {    
    return compile("production")
}

function createPackage(mode: mode) {
    let extensionOverride: IExtensionManifestOverride = { version: semVer }
    let overrideVersion = JSON.stringify( extensionOverride )
    let parameters:string[] = [
        "tfx",
        "extension", 
        "create",
        "--output-path", "package/",
        "--override", overrideVersion,
        "--manifest-globs", "azure-devops-extension.json"       
    ]
    switch (mode) {
        case "development":
            parameters.push("src/**/manifest.dev.json", "--overrides-file", "azure-devops-extension-dev.json")
            break;
        case "stage":
            parameters.push("src/**/manifest.stage.json", "--overrides-file", "azure-devops-extension-stage.json")
            break;
        case "production":
            parameters.push("src/**/manifest.json")
            break;    
        default:
            log.error(`Unknown mode: "${mode}"`)
            break;
    }    
    return spawn('npx', parameters, {stdio: 'inherit'})    
}

function createPackageProd() {
    return createPackage("production")
}

function createPackageDev() {
    return createPackage("development")
}

function createPackageStage() {
    return createPackage("stage")
}

export async function version() {
    let result;
    try {
        result = execSync('gitversion', {encoding: "utf-8"});
    } catch (error) {
        log.error(result)
        log.error(error)
        return await Promise.reject(error)
    }
    semVer = JSON.parse(result)?.SemVer
    log.info(`SemVer: ${semVer}`)

    if(!semVer) {
        return await Promise.reject("Failed to calculate SemVer")
    }

    if(process.env.TF_BUILD) {
        log.info(`##vso[task.setvariable variable=SemVer]${semVer}`)
    }

    return await Promise.resolve()
}

export const stage = series(
    parallel(
        version,
        series(
            clean, 
            compile_dev            
        )
    ),
    createPackageStage
);

export const dev = series(
    parallel(
        version,
        series(
            clean, 
            compile_dev            
        )
    ),
    createPackageDev
);

export const prod = series(
    parallel(
        version,
        series(
            clean, 
            compile_prod            
        )
    ),
    createPackageProd
);
export default prod