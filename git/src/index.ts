import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import * as path from 'path';
import * as fs from 'fs';
import inquirer from "inquirer";
import prompt = inquirer.prompt;
import prepareCommitMsg from "./git-hooks/prepare-commit-msg";
import {cwd, executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";

const clone = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
    const { url } = input.args;
    try {
        const [org, repo] = url.split('/').slice(-2).map((segment: string) => segment.replace('.git', ''));
        const repoDir = path.join(ctx.config.rootDir, org, repo);

        // Check if the repository is already cloned
        if (fs.existsSync(repoDir)) {
            console.log(`Repository already exists at ${repoDir}. Skipping clone step.`);
            return { org, repo, path: repoDir };
        }

        // Clone the repository
        // @ts-ignore
        await executeShellCommand(`git clone ${url} ${repoDir}`);
        console.log(`Repository cloned successfully to ${repoDir}`);
        return { org, repo, path: repoDir };
    } catch (error: any) {
        console.error('Error cloning repository:', error.message);
        return { error: 'Failed to clone repository' };
    }
};

const checkout = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
    const { branch } = input.options;
    const branchNameSanitized = branch.replace(/ /g, '-');

    console.log(branchNameSanitized);

    try {
        await executeShellCommand(`git fetch && git checkout -b ${branchNameSanitized} || git checkout ${branchNameSanitized}`);
        console.log(`Checked out branch ${branchNameSanitized}`);
        return {};
    } catch (error: any) {
        console.error('Error checking out branch:', error.message);
        return { error: 'Failed to checkout branch' };
    }
}

const flowConfigure: Action = async (ctx, input) => {
    const answers: {
        defaultBranch: string,
        productionBranch: string
    } = await prompt([
        {
            type: 'input',
            name: 'defaultBranch',
            message: 'Enter default branch name:'
        },
        {
            type: 'input',
            name: 'productionBranch',
            message: 'Enter production branch name'
        }
    ]);

    ctx.variables.defaultBranch = answers.defaultBranch;
    ctx.variables.productionBranch = answers.productionBranch;

    return {};
}

const flowSetup: Action = async (ctx, input) => {
    fs.writeFileSync(path.join(cwd, '.git', 'hooks', 'prepare-commit-msg'), prepareCommitMsg)
    await executeShellCommand(`chmod +x ${cwd}/.git/hooks/*`)

    return {};
}

const flowCheckout: Action = async (ctx, input) => {
    const {taskId} = input.args;

    const {result: task} = await executeShellCommand(`cpm task get ${taskId}`);
    const defaultBranch = ctx.variables.defaultBranch;

    const titleTrimmed = task.title.split(' ').splice(4).join('-');
    const branchName = `feature/TASK-${task.id}-${titleTrimmed}`;

    await executeShellCommand(`git checkout ${defaultBranch} && git pull origin ${defaultBranch}`);
    await executeShellCommand(`git fetch && git checkout -b ${branchName} || git checkout ${branchName}`)

    if (status === 'Open' || status === 'pending') {
        await executeShellCommand(`cpm task status ${taskId} in-progress`)
    }

    return {};
}

const flowSubmit: Action = async (ctx, input) => {
    const defaultBranch = ctx.variables.defaultBranch;
    const {output: branchName} = await executeShellCommand('git symbolic-ref --short HEAD');
    const taskId = branchName.split('/')[1].split('-')[1];

    const {result: task} = await executeShellCommand(`cpm task get ${taskId}`);

    if (task.status === 'Open' || task.status === 'pending' || task.status === 'in-progress') {
        await executeShellCommand(`cpm task status ${taskId} in-review`)
    }

    await executeShellCommand(`cpm pr create ${branchName} ${defaultBranch}`);

    return {};
}

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'repo clone': clone,
        'repo checkout': checkout,
        'flow configure': flowConfigure,
        'flow setup': flowSetup,
        'flow checkout': flowCheckout,
        'flow submit': flowSubmit
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
