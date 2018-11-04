create table if not exists contracts(
    contractHash VARCHAR(40)  not null,
    name         VARCHAR(128),
    abi          NVARCHAR(1000000),
    primary key (contractHash)
);

create table if not exists contractLookupHistory(
    contractHash VARCHAR(40)  not null,
    date         datetime,
    primary key (contractHash, date)
);

create table if not exists blocks(
    blockNumber BIGINT   not null,
    timeStamp   BIGINT   not null,
    userLog     BIT      not null,
    primary key (blockNumber)
);

create table if not exists variables(
    contractHash VARCHAR(40) not null,
    variableName VARCHAR(50) not null,
    cachedFrom   BIGINT,
    cachedUpTo   BIGINT,
    unitID       BIGINT,
    primary key (contractHash, variableName)
);

create table if not exists variableUnits(
    id          BIGINT not null,
    variable    VARCHAR(50) not null,
    unit        VARCHAR(50) not null,
    description NVARCHAR(MAX),
    primary key (id)
);

create table if not exists dataPoints(
    contractHash VARCHAR(40) not null,
    variableName VARCHAR(50) not null,
    blockNumber  BIGINT      not null,
    value        VARCHAR(78) not null,
    primary key (contractHash, variableName, blockNumber),
    foreign key (contractHash) references contracts(contractHash),
    foreign key (blockNumber) references  blocks(blockNumber),
    foreign key (contractHash, variableName) references  variables(contractHash, variableName)
);
