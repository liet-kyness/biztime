const express = require('express');
const slugify = require('slugify');
const ExpressError = require('../expressError')
const db = require('../db');

let router = new express.Router();

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT code, name, description
            FROM companies
            ORDER BY name`
        );
        return res.json({"companies": result.rows});
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        const compResult = await db.query(
            `SELECT code, name
            FROM companies
            WHERE code = $1`, [code]
        );
        const invResult = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code = $1`, [code]
        );
        
        const result = await db.query(
            `SELECT c.code, c.name, c.description, i.industry
            FROM companies AS c
            LEFT JOIN companies_industries AS ci
            ON c.code = ci.company_code
            LEFT JOIN industries AS i
            ON ci.industries_id = i.ind_code
            WHERE c.code = $1`, [req.params.code]
        );
        let { com, name } = result.rows[0];
        let industries = result.rows.map(r => r.industry);

        return res.json({ com, name, industries});


        if (compResult.rows.length === 0) {
            throw new ExpressError(`not found ${code}`, 404);
        }
        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);
        return res.json({"company": company})
        }
        catch (err) {
            return next(err);
        }
});

router.post('/', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true});

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({"company": result.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = req.params.code;

        const result = await db.query(
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING name, description, code`,
            [name, description, code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError('not found', 404);
        } else {
            return res.json({'company': result.rows[0]});
        }
    }
    catch (err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        const results = await db.query(
            `DELETE FROM companies
            WHERE code=$1
            RETURNING code`,
            [code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError('not found', 404);
        } else {
            return res.json({'status': 'deleted'});
        }
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;

