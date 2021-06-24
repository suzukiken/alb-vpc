import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as acm from '@aws-cdk/aws-certificatemanager';

export class AlbVpcStack extends cdk.Stack {
  
  get availabilityZones(): string[] {
    return [
      'ap-northeast-1b',
      'ap-northeast-1c',
      'ap-northeast-1d'
    ]
  }
  
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const certificate = acm.Certificate.fromCertificateArn(this, 'Acmarn', 
      cdk.Fn.importValue(this.node.tryGetContext('apnortheast1_acmarn_exportname'))
    )
    
    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE,
        }
      ],
    })
    
    const securitygroup = new ec2.SecurityGroup(this, 'SecurityGroup', { vpc: vpc });
    
    const lb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: securitygroup
    })
    
    const http_listener = lb.addListener('HttpListener', {
      port: 80,
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(
        200, 
        {
          contentType: elbv2.ContentType.TEXT_PLAIN,
          messageBody: 'OK',
        }
      )
    })
    
    const https_listener = lb.addListener('HttpsListener', {
      port: 443,
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [ certificate ],
      defaultAction: elbv2.ListenerAction.fixedResponse(
        200, 
        {
          contentType: elbv2.ContentType.TEXT_PLAIN,
          messageBody: 'OK',
        }
      )
    })
    
    new cdk.CfnOutput(this, 'Albarn', { 
      value: lb.loadBalancerArn, 
      exportName: this.node.tryGetContext('albarn_exportname')
    })

    new cdk.CfnOutput(this, 'PublicAlbArnExport', { 
      value: vpc.vpcId, 
      exportName: this.node.tryGetContext('public_vpcid_exportname')
    })
    
    new cdk.CfnOutput(this, 'SecurityGrpExport', { 
      value: securitygroup.securityGroupId, 
      exportName: this.node.tryGetContext('securitygroupid_exportname')
    })
    
    new cdk.CfnOutput(this, 'Listener80Export', { 
      value: http_listener.listenerArn, 
      exportName: this.node.tryGetContext('alb_listener_http_exportname')
    })
    
    new cdk.CfnOutput(this, 'Listener443Export', { 
      value: https_listener.listenerArn, 
      exportName: this.node.tryGetContext('alb_listener_https_exportname')
    })
  }
}
