import {Action, CPMContext, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import {authCodeLogin} from "./oauth";
import {ClickUpAPI} from "./api";
import inquirer from "inquirer";
import prompt = inquirer.prompt;

const clientId = '2E9QXSC2MT3MNRCKAJR9RLHSJJQXZ52Y';
const clientSecret = '9M9H9EUPR3IZW7YNSR6PV0FK7PYV67LG2W365Z9WAWISWXKIQFVOS7O7RIECOHV1';

const selectWorkspace = async (ctx: CPMContext) => {
    const api = new ClickUpAPI(ctx.secrets.token);
    const workspaces = await api.listWorkspaces();

    const options: string[] = [];
    const idMapping: Record<string, string> = {};

    workspaces.forEach(w => {
        options.push(w.name);
        idMapping[w.name] = w.id;
    })

    const answers: {selection: string} = await prompt([
        {
            type: 'list',
            name: 'selection',
            message: 'Select team:',
            choices: options
        }
    ]);

    return idMapping[answers.selection];
}

const selectSpace = async (ctx: CPMContext, teamId: string) => {
    const api = new ClickUpAPI(ctx.secrets.token);
    const spaces = await api.listSpacesInWorkspace(teamId);

    const options: string[] = [];
    const idMapping: Record<string, string> = {};

    spaces.forEach(w => {
        options.push(w.name);
        idMapping[w.name] = w.id;
    })

    const answers: {selection: string} = await prompt([
        {
            type: 'list',
            name: 'selection',
            message: 'Select space:',
            choices: options
        }
    ]);

    return idMapping[answers.selection];
}

const listTasks: Action = (ctx, input) => {
    console.log('Listing tasks...');
    // Implement logic to list tasks
    return {};
};

const getTask: Action = (ctx, input) => {
    const taskId = input.args.id;
    console.log(`Getting task with ID: ${taskId}`);
    // Implement logic to get task
    const task = {
        id: taskId,
        title: 'Sample Task'
    };
    return task;
};

const updateTaskStatus: Action = (ctx, input) => {
    const taskId = input.args.id;
    const newStatus = input.args.status;
    console.log(`Updating status of task ${taskId} to ${newStatus}`);
    // Implement logic to update task status
    return {};
};

const createTaskPlugin: CPMPluginCreator = async (ctx) => {
    if (!ctx.secrets.token) {
        ctx.secrets.token = await authCodeLogin(clientId, clientSecret);
    }

    if (!ctx.variables.teamId) {
        ctx.variables.teamId = await selectWorkspace(ctx);
    }

    if (!ctx.variables.spaceId) {
        ctx.variables.spaceId = await selectSpace(ctx, ctx.secrets.teamId);
    }

    return {
        name: 'clickup',
        actions: {
            'task list': listTasks,
            'task get': getTask,
            'task status': updateTaskStatus
        }
    };
}

// Export the plugin creator function
export default createTaskPlugin;
