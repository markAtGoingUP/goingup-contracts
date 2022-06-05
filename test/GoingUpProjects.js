const { expect } = require('chai');
const { ethers } = require('hardhat');

let contract, contractAsDeployer, contractAsOwner, contractAsAdmin1, contractAsAdmin2, contractAsPublic1;
let deployer, owner, admin1, admin2, public1;

describe('Intialize', () => {
    it('Deploy GoingUpProjects Contract', async () => {
        const signers = await ethers.getSigners();
        deployer = await signers[0].getAddress();
        owner = await signers[1].getAddress();
        admin1 = await signers[2].getAddress();
        admin2 = await signers[3].getAddress();
        public1 = await signers[4].getAddress();

        const GoingUpProjects = await ethers.getContractFactory('GoingUpProjects', signers[0]);
        contract = await GoingUpProjects.deploy();
        await contract.deployed();

        [contractAsDeployer, contractAsOwner, contractAsAdmin1, contractAsAdmin2, contractAsPublic1] = (
            await ethers.getSigners()
        ).map((signer) => contract.connect(signer));
    });
});

describe('Contract ownership', () => {
    it('Owner is deployer', async () => {
        expect(await contract.owner()).to.equal(deployer);
    });

    it('Transfer ownership by non-owner should revert', async () => {
        await expect(contractAsOwner.transferOwnership(owner)).to.be.revertedWith('not the owner');
    });

    it('Transfer ownership by current owner (deployer) to new owner (owner)', async () => {
        await contractAsDeployer.transferOwnership(owner);
        expect(await contract.owner()).to.not.equal(await deployer);
        expect(await contract.owner()).to.equal(await owner);
    });
});

describe('Contract admins', () => {
    it('Admin addresses are not yet admins', async () => {
        expect(await contract.admins(admin1)).to.equal(false);
        expect(await contract.admins(admin2)).to.equal(false);
    });

    it('Not the owner sets address as admin', async () => {
        await expect(contractAsAdmin1.setAdmin(admin1, true)).to.be.revertedWith('not the owner');
        await expect(contractAsAdmin1.setAdmin(admin1, false)).to.be.revertedWith('not the owner');
        await expect(contractAsAdmin2.setAdmin(admin2, true)).to.be.revertedWith('not the owner');
        await expect(contractAsAdmin2.setAdmin(admin2, false)).to.be.revertedWith('not the owner');
    });

    it('Owner sets admin addresses as admin', async () => {
        await contractAsOwner.setAdmin(admin1, true);
        await contractAsOwner.setAdmin(admin2, true);
        expect(await contract.admins(admin1)).to.equal(true);
        expect(await contract.admins(admin2)).to.equal(true);
    });

    it('Owner unsets and resets admin2 address as admin', async () => {
        await contractAsOwner.setAdmin(admin2, false);
        expect(await contract.admins(admin2)).to.equal(false);
        await contractAsOwner.setAdmin(admin2, true);
        expect(await contract.admins(admin2)).to.equal(true);
    });
});

describe('Contract variable "price"', () => {
    it('Variable "price" getter', async () => {
        expect(await contractAsPublic1.price()).to.equal('10000000000000000');
    });

    it('Non admin address tries to set price', async () => {
        await expect(contractAsPublic1.setPrice('25000000000000000')).to.be.revertedWith('not admin');
    })

    it('Admin address sets price', async () => {
        await contractAsAdmin1.setPrice('25000000000000000');
        expect(await contractAsPublic1.price()).to.equal('25000000000000000');
        await contractAsAdmin2.setPrice('35000000000000000');
        expect(await contractAsPublic1.price()).to.equal('35000000000000000');
    })
});
