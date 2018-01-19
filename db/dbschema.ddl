create table contracts(
    address      CHAR(42)  not null,
    name         CHAR(128),
    abi          TEXT,
    primary key (address)
);

create table contractLookupHistory(
    address      CHAR(42)  not null,
    date         datetime,
    primary key (address, date)
);

create table blocks(
    blockNumber  BIGINT   not null,
    timeStamp    BIGINT   not null,
    userLog      BIT      not null,
    primary key (blockNumber)
);

create table variables(
    address      CHAR(42) not null,
    variableName CHAR(50) not null,
    cachedFrom   BIGINT,
    cachedUpTo   BIGINT,
    unitID       BIGINT,
    primary key (address, variableName)
);

create table variableUnits(
    id           BIGINT not null,
    variable     CHAR(50) not null,
    unit         CHAR(50) not null,
    description  TEXT,
    primary key (id)
);

create table dataPoints(
    address      CHAR(42) not null,
    variableName CHAR(50) not null,
    blockNumber  BIGINT   not null,
    value        CHAR(78) not null,
    primary key (address, variableName, blockNumber),
    foreign key (address) references contracts(address),
    foreign key (blockNumber) references  blocks(blockNumber),
    foreign key (address, variableName) references variables(address, variableName)
);
