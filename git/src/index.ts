import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action} from '@cloudimpl-inc/cpm';
import * as path from 'path';
import * as fs from 'fs';
import {executeShellCommand} from '@cloudimpl-inc/cpm/dist/util';
import inquirer from "inquirer";
import prompt = inquirer.prompt;

const configure: Action = async (ctx, input) => {
    const answers: { input: string } = await prompt([
        {
            type: 'input',
            name: 'input',
            message: 'Enter default branch:'
        }
    ]);

    ctx.variables.defaultBranch = answers.input;

    return {};
}

const gitPlugin: CPMPlugin = {
    name: 'git',
    commands: {
        'configure': {
            description: 'configure git plugin (only support interactive mode)'
        }
    },
    actions: {
        'git configure': configure,
        'repo clone': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
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
        },
        'repo checkout': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { branch } = input.options;
            const branchNameSanitized = branch.replace(/ /g, '-');

            console.log(branchNameSanitized);

            try {
                // @ts-ignore
                const defaultBranch = ctx.variables.defaultBranch;
                await executeShellCommand(`git checkout ${defaultBranch} && git pull && 
                git fetch && git checkout -b ${branchNameSanitized} || git checkout ${branchNameSanitized}`);
                console.log(`Checked out branch ${branchNameSanitized}`);
                return {};
            } catch (error: any) {
                console.error('Error checking out branch:', error.message);
                return { error: 'Failed to checkout branch' };
            }
        }
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
