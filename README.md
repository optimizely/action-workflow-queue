# GitHub Action: Workflow Run Queue

If the same workflow is already running from a previous commit, wait for it to finish

[![license][license-img]][license-url]
[![release][release-img]][release-url]

<details>
  <summary><strong>Why?</strong></summary>

Workflows run on every commit asynchronously, this is fine for most cases, however, you might want to wait for a previous commit workflow to finish before running another one, some example use-cases:

- Deployment workflows
- Terraform workflows
- Database Migrations

</details>

## Usage

### Workflow-Level Concurrency (Default)

###### `.github/workflows/my-workflow.yml`

``` yaml
jobs:
  xyz:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: ahmadnassri/action-workflow-queue@v1

      # only runs additional steps if there is no other instance of `my-workflow.yml` currently running
```

### Job-Level Concurrency

For more granular control, you can specify a job name to check concurrency only for that specific job within the workflow:

###### `.github/workflows/deployment-workflow.yml`

``` yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ahmadnassri/action-workflow-queue@v1
        with:
          job-name: "deploy-staging"
      # only waits if another workflow run has the "deploy-staging" job currently running
      - name: Deploy to staging
        run: echo "Deploying to staging..."

  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ahmadnassri/action-workflow-queue@v1
        with:
          job-name: "deploy-production"
      # only waits if another workflow run has the "deploy-production" job currently running
      - name: Deploy to production
        run: echo "Deploying to production..."

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # No queue action - tests can run concurrently
      - name: Run tests
        run: echo "Running tests..."
```

In this example:
- `deploy-staging` jobs from different workflow runs cannot run concurrently
- `deploy-production` jobs from different workflow runs cannot run concurrently  
- `deploy-staging` and `deploy-production` jobs CAN run concurrently with each other
- `test` jobs can always run concurrently

### Inputs

| input          | required | default        | description                                     |
|----------------|----------|----------------|-------------------------------------------------|
| `github-token` | ❌       | `github.token` | The GitHub token used to call the GitHub API    |
| `timeout`      | ❌       | `600000`       | timeout before we stop trying (in milliseconds) |
| `delay`        | ❌       | `10000`        | delay between status checks (in milliseconds)   |
| `job-name`     | ❌       | `null`         | Specific job name to check concurrency for (optional - defaults to workflow-level concurrency) |

----
> Author: [Ahmad Nassri](https://www.ahmadnassri.com/) &bull;
> Twitter: [@AhmadNassri](https://twitter.com/AhmadNassri)

[license-url]: LICENSE
[license-img]: https://badgen.net/github/license/ahmadnassri/action-workflow-queue

[release-url]: https://github.com/ahmadnassri/action-workflow-queue/releases
[release-img]: https://badgen.net/github/release/ahmadnassri/action-workflow-queue
