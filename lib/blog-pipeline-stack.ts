import { Stack, StackProps } from "aws-cdk-lib";
import { Pipeline, Artifact } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeStarConnectionsSourceAction,
  CodeBuildAction,
  S3DeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  PipelineProject,
  LinuxBuildImage,
  ComputeType,
  BuildSpec,
} from "aws-cdk-lib/aws-codebuild";
import { Construct } from "constructs";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BlogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: "blog-deployment",
    });
    const sourceOutput = new Artifact("source");
    const buildOutput = new Artifact("build");

    const sourceStage = pipeline.addStage({ stageName: "Source" });

    sourceStage.addAction(
      new CodeStarConnectionsSourceAction({
        actionName: "GitHub",
        connectionArn: `arn:aws:codestar-connections:${this.region}:${this.account}:connection/f6d21f24-21db-4453-8c18-86ed3e230da6`,
        owner: "DionBrNz",
        branch: "master",
        repo: "blog",
        output: sourceOutput,
      })
    );

    const project = new PipelineProject(this, "blog-deployment", {
      environment: {
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_ARM_2,
        computeType: ComputeType.SMALL,
      },
      buildSpec: BuildSpec.fromSourceFilename("./buildspec.yml"),
      projectName: "blog-deployment",
    });

    const buildStage = pipeline.addStage({ stageName: "Build" });
    buildStage.addAction(
      new CodeBuildAction({
        actionName: "Build",
        input: sourceOutput,
        project,
        outputs: [buildOutput],
      })
    );

    const deployS3 = pipeline.addStage({ stageName: "Deploy" });
    deployS3.addAction(
      new S3DeployAction({
        bucket: Bucket.fromBucketName(this, "bucket", "todothinkofname.net"),
        actionName: "Deploy",
        input: buildOutput,
        extract: true,
      })
    );
  }
}
