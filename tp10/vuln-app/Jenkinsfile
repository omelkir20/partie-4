pipeline {
  agent any
  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Security') {
      parallel {
        stage('Gitleaks') {
          steps {
            sh 'mkdir -p reports'
            sh 'docker run --rm -v "$PWD:/repo" ghcr.io/gitleaks/gitleaks:latest git /repo --report-path /repo/reports/gitleaks.json'
          }
        }
        stage('Semgrep') {
          steps {
            sh 'mkdir -p reports'
            sh 'docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep scan --config p/javascript --config p/owasp-top-ten --error --json -o /src/reports/semgrep.json /src'
          }
        }
        stage('npm audit') {
          steps { sh 'npm ci && npm audit --audit-level=high' }
        }
      }
    }

    stage('Build') { steps { sh 'docker build -t vuln-app:${BUILD_NUMBER} .' } }

    stage('Image scan') {
      steps {
        sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --exit-code 1 --severity CRITICAL vuln-app:${BUILD_NUMBER}'
      }
    }
  }
  post {
    always { archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true }
  }
}
