import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import * as path from 'path';
import * as fs from 'fs';
import inquirer from "inquirer";
import prompt = inquirer.prompt;
import prepareCommitMsg from "./git-hooks/prepare-commit-msg";
import {cwd, executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";
import chalk from 'chalk';
import {execSync} from "child_process";

const taskStatus = {
    OPEN: 'Open',
    PENDING: 'pending',
    IN_PROGRESS: 'in progress',
    COMPLETED: 'completed',
    IN_REVIEW: 'in review',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    BLOCKED: 'blocked',
    CLOSED: 'Closed'
}

const clone = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
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

const checkout = async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
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

const flowSelect: Action = async (ctx, input) => {
    const {result: task} = await executeShellCommand('cpm task select -a');

    if (!task.id || task.id === '') {
        console.log(chalk.red('not task selected'));
        return {};
    } else {
        await executeShellCommand(`cpm flow checkout ${task.id}`);
        return {};
    }
}

const flowCheckout: Action = async (ctx, input) => {
    let taskId;
    if (input.options.taskId) {
        taskId = input.options.taskId;
    } else {
        const {result: task} = await executeShellCommand('cpm task select');
        taskId = task.id;
    }

    const defaultBranch = ctx.variables.defaultBranch;
    let currentBranch = execSync('git symbolic-ref --short HEAD').toString();
    currentBranch = currentBranch.split('\n')[0];
    const statusOutput = execSync('git status -s').toString();

    const {result: task} = await executeShellCommand(`cpm task get ${taskId}`);
    const parts = task.title.split(' ');
    const titleTrimmed = parts.slice(0, Math.min(parts.length, 4)).join('-');
    const branchName = `feature/TASK-${task.id}-${titleTrimmed}`;

    if (currentBranch === branchName) {
        console.log(chalk.green('Already on task branch'));
        return {};
    }

    if (task.status === taskStatus.OPEN) {
        console.log(chalk.yellow('Please assign task and change status to pending'));
        return {};
    }

    if (task.status === taskStatus.BLOCKED) {
        console.log(chalk.yellow('Task is blocked please unblock it first'));
        return {};
    }

    if (task.status === taskStatus.ACCEPTED || task.status === taskStatus.CLOSED) {
        console.log(chalk.yellow('Task already completed'));
        return {};
    }

    if (statusOutput && statusOutput !== '') {
        console.log(chalk.red('Branch has pending changes, please commit them'));
        return {};
    }

    if (task.status === taskStatus.PENDING) {
        await executeShellCommand(`git checkout ${defaultBranch} && git pull origin ${defaultBranch}`);
        await executeShellCommand(`git fetch && git checkout -b ${branchName} || git checkout ${branchName}`);
        await executeShellCommand(`cpm task status ${taskId} '${taskStatus.IN_PROGRESS}'`);
    } else if (task.status === taskStatus.IN_PROGRESS || taskStatus.IN_REVIEW) {
        await executeShellCommand(`git fetch && git checkout ${branchName} && git pull origin ${branchName}`);
    } else if (task.status === taskStatus.REJECTED) {
        await executeShellCommand(`git fetch && git checkout ${branchName} && git pull origin ${branchName}`);
        await executeShellCommand(`cpm task status ${taskId} '${taskStatus.IN_PROGRESS}'`);
    }

    return {};
}

const flowSubmit: Action = async (ctx, input) => {
    const defaultBranch = ctx.variables.defaultBranch;
    let branchName = execSync('git symbolic-ref --short HEAD').toString();
    branchName = branchName.split('\n')[0];
    const statusOutput = execSync('git status -s').toString();

    if (!branchName.startsWith('feature/TASK')) {
        console.log(chalk.red('Not a feature branch'));
        return {};
    }

    if (statusOutput && statusOutput !== '') {
        console.log(chalk.red('Branch has pending changes, please commit them'));
        return {};
    }

    const taskId = branchName.split('/')[1].split('-')[1];
    const {result: task} = await executeShellCommand(`cpm task get ${taskId}`);

    if (task.status === taskStatus.IN_PROGRESS) {
        await executeShellCommand(`git push origin ${branchName}`);
        await executeShellCommand(`cpm task status ${taskId} '${taskStatus.IN_REVIEW}'`)
        await executeShellCommand(`cpm pr create ${branchName} ${defaultBranch}`);
    } else if (task.status === taskStatus.IN_REVIEW) {
        await executeShellCommand(`git push origin ${branchName}`);
    }

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
