import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import * as path from 'path';
import * as fs from 'fs';
import {executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";
import chalk from 'chalk';
import {execSync} from "child_process";

const clone: Action = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
    const {url} = input.args;
    try {
        const [org, repo] = url.split('/').slice(-2).map((segment: string) => segment.replace('.git', ''));
        const repoDir = path.join(ctx.config.rootDir, org, repo);

        // Check if the repository is already cloned
        if (fs.existsSync(repoDir)) {
            console.log(chalk.yellow(`Repository already exists at ${repoDir}. Skipping clone step.`));
            return {org, repo, path: repoDir};
        }

        // Clone the repository
        // @ts-ignore
        await executeShellCommand(`git clone ${url} ${repoDir}`);
        console.log(chalk.green(`Repository cloned successfully to ${repoDir}`));
        return {org, repo, path: repoDir};
    } catch (error: any) {
        console.error('Error cloning repository:', error.message);
        return {error: 'Failed to clone repository'};
    }
};

const checkout: Action = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
    const {branch} = input.options;
    const branchNameSanitized = branch.replace(/ /g, '-');

    console.log(branchNameSanitized);

    try {
        await executeShellCommand(`git fetch && git checkout -b ${branchNameSanitized} || git checkout ${branchNameSanitized}`);
        console.log(chalk.green(`Checked out branch ${branchNameSanitized}`));
        return {};
    } catch (error: any) {
        console.error('Error checking out branch:', error.message);
        return {error: 'Failed to checkout branch'};
    }
}

const info: Action = async (ctx, input) => {
    let currentBranch = execSync('git symbolic-ref --short HEAD').toString();
    currentBranch = currentBranch.split('\n')[0];
    const statusOutput = execSync('git status -s').toString();
    const changesPending = (statusOutput && statusOutput !== '') ? "true" : "false";

    return {
        currentBranch,
        changesPending
    }
}

const sync: Action = async (ctx, input) => {
    let currentBranch = execSync('git symbolic-ref --short HEAD').toString();
    currentBranch = currentBranch.split('\n')[0];
    await executeShellCommand(`git pull origin ${currentBranch} && git push origin ${currentBranch}`);

    return {};
}

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'repo clone': clone,
        'repo checkout': checkout,
        'repo info': info,
        'repo sync': sync
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
