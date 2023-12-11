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

resource "aws_s3_bucket_object" "lambda_zip" {
  bucket = "s3-echo-web"
  key    = "archive/package.zip"
  source = "./archive/package.zip"
  etag = filemd5("./archive/package.zip")
}

resource "aws_lambda_function" "lambda-echo-post-message" {
  function_name = "lambda-echo-post-message"
  runtime       = "nodejs18.x"
  handler       = "./lambda/src/js/resources/messageSender.handler"
  source_code_hash = filebase64("./archive/package.zip")
  memory_size = 256
  timeout = "5"

  s3_bucket        = aws_s3_bucket_object.lambda_zip.bucket
  s3_key           = aws_s3_bucket_object.lambda_zip.key
  role             = aws_iam_role.iam-echo-lambda.arn
}

resource "aws_lambda_function" "lambda-echo-get-message" {
  function_name = "lambda-echo-get-message"
  runtime       = "nodejs18.x"
  handler       = "./lambda/src/js/resources/messageFinder.handler"
  source_code_hash = filebase64("./archive/package.zip")
  memory_size = 256
  timeout = "5"

  s3_bucket        = aws_s3_bucket_object.lambda_zip.bucket
  s3_key           = aws_s3_bucket_object.lambda_zip.key
  role             = aws_iam_role.iam-echo-lambda.arn
}
