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

  content_type = lookup({
    "html" = "text/html",
    "css"  = "text/css",
    "js"   = "application/javascript",
    "png"  = "image/png",
    "jpg"  = "image/jpeg",
    "jpeg" = "image/jpeg",
    "svg"  = "image/svg+xml",
  }, split(".", each.value)[1], "binary/octet-stream")
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

resource "aws_lambda_function" "lambda-echo-weather" {
  function_name = "lambda-echo-weather"
  runtime       = "nodejs18.x"
  handler       = "./lambda/src/js/lambdas/messageWeather.handler"
  source_code_hash = filebase64sha256("./archive/package.zip")
  memory_size = 256
  timeout = "5"

  s3_bucket        = aws_s3_bucket_object.lambda_zip.bucket
  s3_key           = aws_s3_bucket_object.lambda_zip.key
  role             = aws_iam_role.iam-echo-lambda.arn
}

resource "aws_cloudwatch_event_rule" "echo_weather_lambda_trigger" {
  name        = "WeatherLambdaTriggerRule"
  description = "Récupération de la météo de Lille"
  schedule_expression = "rate(10 minutes)"
}

resource "aws_cloudwatch_event_target" "echo_weather_lambda_target" {
  rule      = aws_cloudwatch_event_rule.echo_weather_lambda_trigger.name
  target_id = "WeatherLambdaTarget"
  arn       = aws_lambda_function.lambda-echo-weather.arn
}

resource "aws_iam_role_policy_attachment" "attach_dynamodb_policy" {
  role       = aws_iam_role.iam-echo-lambda.name
  policy_arn = "arn:aws:iam::144312316210:policy/iam-policy-student-dynamodb"
}

resource "aws_api_gateway_rest_api" "ag-echo-api" {
  name        = "ag-echo-api"
}

resource "aws_lambda_permission" "lambda-echo-permission-get" {
  statement_id  = "AllowExecutionFromAPIGatewayGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda-echo-get-message.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = aws_api_gateway_rest_api.ag-echo-api.arn
}

resource "aws_lambda_permission" "lambda-echo-permission-post" {
  statement_id  = "AllowExecutionFromAPIGatewayPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda-echo-post-message.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = aws_api_gateway_rest_api.ag-echo-api.arn
}

data "aws_cognito_user_pools" "existing_pool" {
  name = "cognito-echo-users"
}
