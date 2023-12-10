provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      group = "echo"
    }
  }
}

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 4.19"

    }
  }

  backend "s3" {
    bucket = "s3-echo-web"
    key    = "tf/tfstate"
    region = "eu-west-1"
  }
}

data "aws_s3_bucket" "existing_bucket" {
  bucket = "s3-echo-web"
}

data "aws_cloudfront_distribution" "existing_cloudfront" {
  id          = "EHHQIS3FSYB27"
  domain_name = "https://d3g96be41122l7.cloudfront.net"
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_s3_bucket" "echo_s3_bucket" {
  bucket = "s3-echo-web"
}

resource "aws_iam_role" "iam-echo-lambda" {
  name               = "iam-echo-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}
