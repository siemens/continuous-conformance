/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

interface Target {
    id: string
}

interface Icon {
    default: string
}

interface Branding {
    color: string,
    theme: string
}

interface ContentFile {
    path: string
}

interface Content {
    details?: ContentFile,
    license?: ContentFile
}

interface Links {
    getstarted?: LinkURI,
    learn?: LinkURI,
    license?: LinkURI,
    privacypolicy?: LinkURI,
    support?: LinkURI
}

interface LinkURI {
    uri: string
}


interface Repository {
    type: "git",
    uri: string
}

interface ContributionProperty {
    title?: string,
    uri?: string
}

interface Contribution {
    id: string,
    type: string,
    description?: string,
    targets: string[],
    properties?: ContributionProperty
}

interface File {
    path: string,
    addressable?: boolean,
    packagePath?: string,
    contentType?: string,
    assetType?: string | string[],
    lang?: string
}

export interface ExtensionManifest 
{
    manifestVersion: number, 
    id: string,
    version: string,
    name: string,
    publisher: string,
    description?: string,
    targets: Target[],
    icons?: Icon[],
    scopes?: string[],
    categories: string[],
    branding?: Branding,
    content?: Content,
    links?: Links,
    repository?: Repository,
    contributions: Contribution[],
    files?: File[]
}

