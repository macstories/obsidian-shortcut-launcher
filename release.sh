# install json
if ! command -v "json" &> /dev/null
then
    npm install -g json
fi

# install gh
if ! command -v "gh" &> /dev/null
then
    brew install gh
fi

json -I -f package.json -e "this.version=\"$1\""
json -I -f manifest.json -e "this.version=\"$1\""
json -I -f versions.json -e "this[\"$1\"]=\"0.13.0\""

npm run build

git commit -a -m "Release $1"
git push

git tag $1
git push origin --tags

gh release create $1 ./{manifest.json,main.js}
