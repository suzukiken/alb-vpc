#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlbVpcStack } from '../lib/alb-vpc-stack';

const app = new cdk.App();
new AlbVpcStack(app, 'AlbVpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' },
});
