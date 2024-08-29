import { App, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { CrossAccountZoneDelegationRecord, HostedZone } from 'aws-cdk-lib/aws-route53';
import { ShellStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

class MyServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // This Construct adds a node with the type `publish-assets` which triggers the behavior.
    new CrossAccountZoneDelegationRecord(this, 'cross-account-zone', {
      delegatedZone: HostedZone.fromHostedZoneAttributes(this, 'my-hosted-zone', {
        hostedZoneId: 'Z01201272X6Y0ABCDE0FG',
        zoneName: 'zone.name',
      }),
      delegationRole: Role.fromRoleName(this, 'my-role', 'my-role-name'),
      parentHostedZoneId: 'parent-hosted-zone',
    });
  }
}

class MyStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new MyServiceStack(this, 'my-stack');
  }
}

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'my-pipeline', {
      synth: new ShellStep('my-build', {
        input: CodePipelineSource.gitHub(
          'my-org/my-repo',
          'main',
        ),
        commands: [
          "echo 'hello world'",
        ],
      }),
      cliVersion: '2.154.1',
    });

    const wave = pipeline.addWave('my-wave');
    wave.addStage(new MyStage(this, 'my-stage'));
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'cdk-assets-bug-dev', { env: devEnv });

app.synth();
