# SPDX-FileCopyrightText: 2022 Siemens AG
# SPDX-License-Identifier: MIT
 

# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.183.0/containers/typescript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version: 16, 14, 12
ARG VARIANT="14-buster"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

# Add package source for git-lfs
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        default-jdk \
        libgssapi-krb5-2 \
        libicu-dev \
        build-essential \
        git-lfs

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list -here>"

RUN curl -s https://api.github.com/repos/GitTools/GitVersion/releases/latest \
    | grep "browser_download_url.*gitversion-linux-x64" \
    | cut -d : -f 2,3 | tr -d \" | wget -qi - -O ~/gitversion.tgz \
    && mkdir /opt/gitversion \
    && tar -xzvf ~/gitversion.tgz -C /opt/gitversion \
    && sudo chmod -R +rx /opt/gitversion \
    && ln -sf /opt/gitversion/gitversion /usr/local/bin/gitversion \
    && rm -f ~/gitversion.tgz \
    && gitversion /version

# Update npm at first and the install
# any other required package.
RUN su node -c "npm install -g npm" \
    && su node -c "npm install -g gulp-cli tfx-cli"
