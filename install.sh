export REGION=ap-northeast-2
export COMPANY=cclab
export TEAM=cclab
export STAGE=dev
export ACCOUNT_ID=590183717745
export MEMORY_SIZE=512
echo $ACCOUNT_ID

# change default bucket name
DOMAIN="hello-retail-${ACCOUNT_ID}.biz"
sed -i "s|hello-retail.biz|${DOMAIN}|g" web/deploy.sh
sed -i "s|hello-retail.biz|${DOMAIN}|g" private.yml
sed -i "s|hello-retail.biz|${DOMAIN}|g" product-photos/productPhotos.yml

npm run root:install:all
