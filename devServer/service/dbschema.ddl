create table contracts(
    contractHash VARCHAR(40)  not null,
    name         VARCHAR(128),
    primary key (contractHash)
);

create table blocks(
    blockNumber BIGINT   not null,
    timeStamp   DATETIME not null,
    primary key (timeStamp)
);

create table variables(
    contractHash VARCHAR(40) not null,
    variableID   INT         not null,
    name         VARCHAR(128),
    primary key (contractHash, variableID)
);

create table dataPoints(
    contractHash VARCHAR(40) not null,
    variableID   VARCHAR(50) not null,
    timeStamp    DATETIME    not null,
    value        VARCHAR(78) not null,
    primary key (contractHash, variableID, timeStamp),
    foreign key (contractHash) references contracts(contractHash),
    foreign key (timeStamp) references  blocks(timeStamp)
);
