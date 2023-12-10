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

data "aws_s3_bucket" "existing_echo_s3_bucket" {
  bucket = "s3-echo-web"
}

resource "aws_s3_bucket" "echo_s3_bucket" {
  count  = data.aws_s3_bucket.existing_echo_s3_bucket.bucket != null ? 0 : 1
  bucket = "s3-echo-web"

  tags = {
    service = "s3"
  }
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

resource "aws_iam_role" "iam-echo-lambda" {
  name               = "iam-echo-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}
