pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'vriddhi'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Vriddhi source code...'
                checkout scm
            }
        }

        stage('Configure Environment') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'vriddhi-backend-env',
                        variable: 'BACKEND_ENV'
                    ),
                    file(
                        credentialsId: 'vriddhi-frontend-env',
                        variable: 'FRONTEND_ENV'
                    )
                ]) {
                    sh '''
                        cp "$BACKEND_ENV" backend/.env
                        cp "$FRONTEND_ENV" .env
                    '''
                }
            }
        }

        stage('Docker Check') {
            steps {
                sh 'docker --version'
                sh 'docker compose version'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building frontend and backend Docker images...'
                sh 'docker compose build'
            }
        }

        stage('Stop Existing Deployment') {
            steps {
                echo 'Stopping existing Vriddhi containers...'
                sh 'docker compose down'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting Vriddhi containers...'
                sh 'docker compose up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Checking running containers...'
                sh 'docker compose ps'
            }
        }
    }

    post {
        success {
            echo 'Vriddhi deployment completed successfully!'
        }

        failure {
            echo 'Vriddhi deployment failed.'
            sh 'docker compose logs --tail=100 || true'
        }

        always {
            sh 'rm -f backend/.env .env || true'
            echo 'Jenkins pipeline finished.'
        }
    }
}
