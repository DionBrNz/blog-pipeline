import { Stack, StackProps, aws_codepipeline as codepipeline, aws_codepipeline_actions as actions, aws_codebuild as codebuild, aws_s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BlogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName : 'blog-deployment'
    });
    const sourceOutput = new codepipeline.Artifact("source")
    const buildOutput = new codepipeline.Artifact('build');

    const sourceStage = pipeline.addStage({stageName: 'Source'})
    

    sourceStage.addAction(new actions.CodeStarConnectionsSourceAction({
      actionName : 'GitHub',
      connectionArn : `arn:aws:codestar-connections:${this.region}:${this.account}:connection/f6d21f24-21db-4453-8c18-86ed3e230da6`,
      owner: 'DionBrNz',
      branch: "master",
      repo: 'blog',
      output: sourceOutput
    }))

    const project = new codebuild.PipelineProject(this, 'blog-deployment', {
      environment:  {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2,
        computeType: codebuild.ComputeType.SMALL
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('./buildspec.yml'),
      projectName: 'blog-deployment'
     })

    const buildStage = pipeline.addStage({stageName: 'Build'})
    buildStage.addAction(new actions.CodeBuildAction({
      actionName: 'Build',
      input: sourceOutput,
      project,
      outputs: [buildOutput]
    }))

    const deployS3 = pipeline.addStage({stageName: 'Deploy'})
    deployS3.addAction(new actions.S3DeployAction({
      bucket: aws_s3.Bucket.fromBucketName(this, 'bucket', 'todothinkofname.net'),
      actionName: 'Deploy',
      input: buildOutput,
      extract: true
    }))

  }
}
