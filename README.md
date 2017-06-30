# Etheroscope

Etheroscope is a minimum viable product for a smart contract Ethereum explorer that will focus on exploring the evolution
of contract state rather than tracking raw transactions. There is a [live demo](http://etheroscope.alice.si) available.

### Overview

Etheroscope it's a proof of concept that's built on top of a [Parity Ethereum Client](). Currently it uses [Etherscan](https://etherscan.io/)
to fetch publicly available contract interface but the ability to natively publish the interface may be added in the feature.
The app queries the contract methods that return numeric values and renders them as a chart.

### Running in development mode

The application requires an active [Ethereum Parity client](https://parity.io/) to run. You need to start it in the archive mode:

    parity --tracing on --pruning archive --dapps-port=9090

Parity connection is defined in config.js file:

    config.parityUrl = "http://localhost:8545";

To start the app, first install all of the [node-js](https://github.com/nodejs/node) dependencies:

    npm install

Then install [bower](https://bower.io/) dependencies (pick angular 1.5.9 when asked to select a version):

    bower install

You may run a tool to fetch and cache all of the block creation timestamps to speed up chart rendering:

    node ./tools/fetchBlocks.js

Finally, you can start the server in a debug mode:

    gulp watch-dev

You should be able to access the app on the [localhost](http://localhost:8080).

### Contribution

The current version is at a proof of concept stage. We encourage anyone to submit any comments or feature requests.
The is vast potential in optimizing the performance by better caching, indexing and pre-fetching, but it's important
that the development is guided by user need and not the technology itself.

## License

MIT License

Copyright (c) 2017 Alice Ltd. (Jakub Wojciechowski jakub@alice.si)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.