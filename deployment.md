# Deploying to AWS S3

Since this is a static React application, it can be hosted directly on AWS S3 without a backend server (Node.js is only needed for building).

## Prerequisite: Build the Project
Ensure you have created the production build.
```bash
npm run build
```
This creates a `dist` folder in your project root containing [index.html](file:///d:/Project/TradingUI/index.html), `assets/`, etc.

## Option 1: Using AWS CLI (Recommended)
You have the AWS CLI installed (`aws-cli/2.32.17`). This is the fastest method.

1.  **Create a Bucket** (if you haven't already):
    ```bash
    aws s3 mb s3://your-unique-bucket-name
    ```

2.  **Enable Static Website Hosting**:
    ```bash
    aws s3 website s3://your-unique-bucket-name/ --index-document index.html --error-document index.html
    ```

3.  **Upload Files**:
    Run this command from the project root (`d:\Project\TradingUI`):
    ```bash
    aws s3 sync dist s3://your-unique-bucket-name
    ```

4.  **Policy**: You may need to add a bucket policy to make it public if you want it accessible to the world.

## Option 2: AWS Console (Manual)
1.  Log in to the **AWS Console** and go to **S3**.
2.  Create a new bucket (e.g., `my-trading-app`).
3.  Open the bucket and go to the **Properties** tab. Scroll down to **Static website hosting** and enable it. Set Index document to [index.html](file:///d:/Project/TradingUI/index.html).
4.  Go to the **Objects** tab and click **Upload**.
5.  Drag and drop **all files and folders inside the `dist` folder** (not the `dist` folder itself, but its contents: [index.html](file:///d:/Project/TradingUI/index.html), `assets`, etc.).
6.  Click **Upload**.

## Verification
Once uploaded, your website will be available at the endpoint provided in the "Static website hosting" section (e.g., `http://your-bucket-name.s3-website-us-east-1.amazonaws.com`).
