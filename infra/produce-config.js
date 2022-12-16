#!/usr/bin/env node

const aws = require('aws-sdk');
const fs = require('fs');

//const argv = require('yargs')
//    .usage('Create ECS/CodeDeploy config files with values from CloudFormation stacks\nUsage: $0')
//    .demandOption(['s', 'd'])
//    .alias('s', 'infra-stack-name')
//    .alias('d', 'service-stack-name')
////    .alias('g', 'stage-name')
////    .alias('h', 'hook-stack-name')
//    .argv;
const argv = require('yargs')
    .usage('Create ECS/CodeDeploy config files with values from CloudFormation stacks\nUsage: $0')
    .demandOption(['s'])
    .alias('s', 'infra-stack-name')
    .argv;

// load json file
const taskDefConfig = require('./task-definition.json');
const appSpec = require('./appspec.json');

//const stage = argv.stageName;
const infraStack = argv.infraStackName;
//const serviceStack = argv.serviceStackName;
//const hookStack = argv.hookStackName;

aws.config.update({region : 'ap-northeast-2'})
const cfn = new aws.CloudFormation();

async function produceConfigs() {
    let infraData = await cfn.describeStackResources({ StackName: infraStack }).promise();
//    let serviceData = await cfn.describeStackResources({ StackName: serviceStack }).promise();
//    let hookData = await cfn.describeStackResources({ StackName: hookStack }).promise();

    // Make a whole bunch of assumptions about the contents of the CFN stacks
    let privateSubnets = [];
    let serviceSecurityGroups = [];
    let taskRole;
    let executionRole;
    let preTrafficHook;

    for (const resource of infraData.StackResources) {
        if (resource.ResourceType == 'AWS::EC2::Subnet' &&
                    resource.LogicalResourceId.startsWith('samplecommentvpcPrivate')) {
            privateSubnets.push(resource.PhysicalResourceId);
            console.log(resource.PhysicalResourceId)
        } else if (resource.ResourceType == 'AWS::EC2::SecurityGroup' &&
                    resource.LogicalResourceId.startsWith('samplecommentservicesg')) {
            serviceSecurityGroups.push(resource.PhysicalResourceId);
            console.log(resource.PhysicalResourceId)
        }

        if (resource.ResourceType == 'AWS::IAM::Role' &&
            resource.LogicalResourceId.startsWith('SampleCommentTaskDefExecutionRole')) {
            executionRole = resource.PhysicalResourceId;
            console.log(resource.PhysicalResourceId);
        } else if (resource.ResourceType == 'AWS::IAM::Role' &&
            resource.LogicalResourceId.startsWith('SampleCommentTaskDefTaskRole')) {
            taskRole = resource.PhysicalResourceId;
            console.log(resource.PhysicalResourceId);
        }
    }

//    for (const resource of hookData.StackResources) {
//        if (resource.LogicalResourceId == 'PreTrafficHook') {
//            preTrafficHook = resource.PhysicalResourceId;
//        }
//    }

    // Write out task def config
    taskDefConfig.taskRoleArn = taskRole;
    taskDefConfig.executionRoleArn = executionRole;
    fs.writeFileSync(`./build/task-definition-sample.json`, JSON.stringify(taskDefConfig, null, 2) , 'utf-8');

    // Write out appspec
    appSpec.Resources[0].TargetService.Properties.NetworkConfiguration.awsvpcConfiguration.subnets = privateSubnets;
    appSpec.Resources[0].TargetService.Properties.NetworkConfiguration.awsvpcConfiguration.securityGroups = serviceSecurityGroups;
    //appSpec.Hooks[0].AfterAllowTestTraffic = preTrafficHook;
    fs.writeFileSync(`./build/appspec-sample.json`, JSON.stringify(appSpec, null, 2) , 'utf-8');
}

produceConfigs().catch(err => {
    console.error('There was an uncaught error', err);
    process.exit(1);
});
