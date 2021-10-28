<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <script type="module" src="${ctx.contextPath}/.resources/cars/webresources/hierarchical-browser.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <style>
        p {
            color: green;
        }
    </style>
</head>
<body>
    <p>Testing web component <span>hierarchical-browser</span></p>

    <template id="browser-loading">
        <style>
            span {
                color: grey;
            }
        </style>
        <p>Loading browser for endpoint <span class="endpoint-name"></span> ...</p>
    </template>
    <template id="browser-items">
        <style>
            .content-list {
                width: 100%;
            }
            thead {
                font-weight: bolder;
                text-transform: capitalize;   
            }
            .folder {
                background-color: yellow;
                cursor: pointer;
            }
            tbody tr:hover {
                background-color: #ffff99;
            }
        </style>
        <p>Showing items in path <span class="items-path"></span></p>
        <table class="content-list">
        </table>
    </template>

    <hierarchical-browser baseUrl="${ctx.contextPath}" endpoint="cars" columns="name,model,power"></hierarchical-browser>
</body>
</html>