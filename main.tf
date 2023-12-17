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

resource "aws_s3_bucket_object" "front_files" {
  for_each     = fileset("${path.module}/front/src", "**/*")
  bucket       = aws_s3_bucket.echo_s3_bucket.bucket
  key          = each.value
  source       = "${path.module}/front/src/${each.value}"
  etag         = filemd5("${path.module}/front/src/${each.value}")

  content_type = switch(
    last(split(".", each.value)),
    "html", "text/html",
    "css",  "text/css",
    "js",   "application/javascript",
    "png",  "image/png",
    "jpg",  "image/jpeg",
    "jpeg", "image/jpeg",
    "svg",  "image/svg+xml",
    "binary/octet-stream"
  )
}

resource "aws_lambda_function" "lambda-echo-post-message" {
  function_name = "lambda-echo-post-message"
  runtime       = "nodejs18.x"
  handler       = "./lambda/src/js/lambdas/messageSender.handler"
  source_code_hash = filebase64sha256("./archive/package.zip")
  memory_size = 256
  timeout = "5"

  s3_bucket        = aws_s3_bucket_object.lambda_zip.bucket
  s3_key           = aws_s3_bucket_object.lambda_zip.key
  role             = aws_iam_role.iam-echo-lambda.arn
}

resource "aws_lambda_function" "lambda-echo-get-message" {
  function_name = "lambda-echo-get-message"
  runtime       = "nodejs18.x"
  handler       = "./lambda/src/js/lambdas/messageFinder.handler"
  source_code_hash = filebase64sha256("./archive/package.zip")
  memory_size = 256
  timeout = "5"

  s3_bucket        = aws_s3_bucket_object.lambda_zip.bucket
  s3_key           = aws_s3_bucket_object.lambda_zip.key
  role             = aws_iam_role.iam-echo-lambda.arn
}

resource "aws_iam_role_policy_attachment" "attach_dynamodb_policy" {
  role       = aws_iam_role.iam-echo-lambda.name
  policy_arn = "arn:aws:iam::144312316210:policy/iam-policy-student-dynamodb"
}

resource "aws_lambda_permission" "lambda-echo-permission-get" {
  statement_id  = "AllowExecutionFromAPIGatewayGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda-echo-get-message.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = aws_s3_bucket.echo_s3_bucket.arn
}

resource "aws_lambda_permission" "lambda-echo-permission-post" {
  statement_id  = "AllowExecutionFromAPIGatewayPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda-echo-post-message.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = aws_s3_bucket.echo_s3_bucket.arn
}

resource "aws_api_gateway_rest_api" "ag-echo-api" {
  name        = "ag-echo-api"
  description = "API Gateway pour le groupe echo"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "ag-echo-resource" {
  rest_api_id = aws_api_gateway_rest_api.ag-echo-api.id
  parent_id   = aws_api_gateway_rest_api.ag-echo-api.root_resource_id
  path_part   = "messages"
}

data "aws_cognito_user_pools" "existing_pool" {
  name = "cognito-echo-users"
}

resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name                   = "CognitoAuthorizer"
  rest_api_id            = aws_api_gateway_rest_api.ag-echo-api.id
  type                   = "COGNITO_USER_POOLS"
  identity_source        = "method.request.header.Authorization"
  provider_arns          = [data.aws_cognito_user_pools.existing_pool.arns[0]]
  authorizer_credentials = aws_iam_role.iam-echo-lambda.arn
}

resource "aws_api_gateway_method" "ag-echo-method-get" {
  rest_api_id   = aws_api_gateway_rest_api.ag-echo-api.id
  resource_id   = aws_api_gateway_resource.ag-echo-resource.id
  http_method   = "GET"
  authorization = aws_api_gateway_authorizer.cognito_authorizer.type
  authorizer_id  = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_method" "ag-echo-method-post" {
  rest_api_id   = aws_api_gateway_rest_api.ag-echo-api.id
  resource_id   = aws_api_gateway_resource.ag-echo-resource.id
  http_method   = "POST"
  authorization = aws_api_gateway_authorizer.cognito_authorizer.type
  authorizer_id  = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "echo_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ag-echo-api.id
  resource_id             = aws_api_gateway_resource.ag-echo-resource.id
  http_method             = aws_api_gateway_method.ag-echo-method-get.http_method
  integration_http_method = "GET"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda-echo-get-message.invoke_arn
}

resource "aws_api_gateway_integration" "echo_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ag-echo-api.id
  resource_id             = aws_api_gateway_resource.ag-echo-resource.id
  http_method             = aws_api_gateway_method.ag-echo-method-post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda-echo-post-message.invoke_arn
}
