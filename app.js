const express = require('express');
const ExpressError = require('./expressError');
const companiesRoutes = require('./routes/companies');
const invoicesRoutes = require('./routes/invoices');
//const industriesRoutes = require('./routes/industries');

const app = express();

app.use(express.json());
app.use('/companies', companiesRoutes);
app.use('/invoices', invoicesRoutes);
//app.use('/industries', industriesRoutes);

app.use((req, res, next) => {
    const err = new ExpressError('boner', 404);
    return next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);

    return res.json({
        error: err,
        message: err.message
    });
});

app.listen(5555, () => {
    console.log('slingshot.. engaged.')
});
module.exports = app;