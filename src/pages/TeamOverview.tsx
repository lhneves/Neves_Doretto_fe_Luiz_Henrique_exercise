import React, {useEffect, useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import {ITeamOverview, IUserData} from 'types';
import {toast} from 'react-toastify';

import useSWR from 'swr';
import {getData, getUserData} from '../api';

import Card from '../components/Card';
import {Container} from '../components/GlobalComponents';
import Header from '../components/Header';
import List from '../components/List';

const TeamOverview = () => {
    const location = useLocation();
    const {teamId} = useParams();

    const [isLoading, setIsLoading] = useState(true);

    const [searchTeam, setSearchTeam] = useState('');
    const [usersFiltered, setUsersFiltered] = useState<IUserData[]>();

    const {data: teamOverview, error: teamError} = useSWR<ITeamOverview>(
        `teams/${teamId}`,
        getData
    );
    const {data: teamLead, error: leadError} = useSWR<IUserData>(
        () => `users/${teamOverview.teamLeadId}`,
        getData
    );
    const {data: teamMembers, error: membersError} = useSWR(
        () => teamOverview.teamMemberIds,
        async ids => Promise.all(ids.map(id => getUserData(id)))
    );

    useEffect(() => {
        const hasError = !!teamError || !!leadError || !!membersError;
        const hasNullResponse = teamOverview === null || teamLead === null || teamMembers === null;

        if (hasError || hasNullResponse) {
            toast.error('Something went wrong, try again!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        }
    }, [teamError, leadError, membersError, teamOverview, teamLead, teamMembers]);

    useEffect(() => {
        if (teamMembers && teamMembers.length > 0) {
            setIsLoading(false);
        }
    }, [teamMembers]);

    const formatMembersToCards = (membersList: IUserData[]) => {
        if (membersList.length === 0) {
            return [];
        }

        return membersList.map(member => {
            const name = `${member.firstName} ${member.lastName} (${member.displayName})`;

            return {
                id: member.id,
                title: 'Team Member',
                navigateTo: `/user/${member.id}`,
                location: member.location,
                navigationProps: member,
                name,
            };
        });
    };

    const teamLeadCard = () => {
        const name = `${teamLead.firstName} ${teamLead.lastName} (${teamLead.displayName})`;

        return (
            <Card
                key={teamLead.id}
                id={teamLead.id}
                name={name}
                title="Team Lead"
                location={teamLead.location}
                navigateTo={`/user/${teamLead.id}`}
                navigationProps={teamLead}
            />
        );
    };

    const handleUserSearch = (userName: string) => {
        setSearchTeam(userName);
        if (userName === '') {
            setUsersFiltered(undefined);
            return;
        }

        const allUsers = [teamLead, ...teamMembers];

        const usersFilter = allUsers.filter(user => {
            const name = `${user.firstName} ${user.lastName}`;

            return name.toLowerCase().includes(userName.toLowerCase());
        });

        setUsersFiltered(usersFilter);
    };

    return (
        <Container>
            <Header
                title={`Team ${location.state.name ? location.state.name : ''}`}
                searchInput={teamMembers && {value: searchTeam, onChange: handleUserSearch}}
            />
            {!isLoading && !usersFiltered && teamLead && teamLeadCard()}
            <List
                items={formatMembersToCards(usersFiltered ?? teamMembers ?? [])}
                isLoading={isLoading}
            />
        </Container>
    );
};

export default TeamOverview;
