create table contracts(
    contractHash VARCHAR(40)  not null,
    name         VARCHAR(128),
    abi          NVARCHAR(MAX),
    primary key (contractHash)
);
