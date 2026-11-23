#!/bin/bash
set -Eeuo pipefail

exec > >(tee -a /var/log/vriddhi-user-data.log) 2>&1

trap 'echo "ERROR: User Data failed at line $LINENO"; docker ps -a || true; docker logs vriddhi-frontend 2>&1 || true' ERR

echo "Starting Vriddhi frontend deployment..."

AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="001800893431"
ECR_REPOSITORY="vriddhi-frontend"
IMAGE_TAG="latest"
APP_ALB_DNS="internal-Vriddhi-App-ALB-2137928074.ap-south-1.elb.amazonaws.com"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

apt-get update -y
apt-get install -y docker.io awscli curl

systemctl enable docker
systemctl start docker

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

docker pull "$IMAGE_URI"

docker run -d \
  --name vriddhi-frontend \
  --restart unless-stopped \
  -p 80:80 \
  -e APP_ALB_DNS="$APP_ALB_DNS" \
  "$IMAGE_URI"

for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1/ > /dev/null; then
    echo "Vriddhi frontend is healthy!"
    exit 0
  fi
  sleep 5
done

echo "Frontend health check failed."
exit 1
