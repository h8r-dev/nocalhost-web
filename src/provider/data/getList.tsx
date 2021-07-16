import { stringify } from 'query-string';
import searchToObj from '../../utils/searchToObj';
import { Application, Result, Cluster } from '../../types';
import { GetListParams } from 'react-admin';
import { deserializeApplication, deserializeCluster } from './deserialize';
import * as qs from 'query-string';

const getList = async (
    apiUrl: string,
    httpClient: (url: any, options?: any) => Promise<any>,
    resource: string,
    params: GetListParams
) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return Promise.reject();
    }
    const options = {
        user: { authenticated: true, token: `Bearer ${token}` },
    };
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
        sort: JSON.stringify([field, order]),
        range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
        filter: JSON.stringify(params.filter),
    };
    let url = `${apiUrl}/${resource}?${stringify(query)}`;
    if (resource === 'dev_space') {
        const hash = window.location.hash;
        const search = hash.substring(hash.indexOf('?'));
        const p = searchToObj(search);
        url = `${apiUrl}/cluster/${p.cluster}/dev_space`;
    }
    if (resource === 'devspace') {
        // const hash = window.location.hash;
        // const search = hash.substring(hash.indexOf('?'));
        // const p = searchToObj(search);
        // url = `${apiUrl}/application/${p.application}/dev_space_list`;
        const hash = window.location.hash;
        const search = hash.substring(hash.indexOf('?'));
        const p = qs.parse(search);
        url = `${apiUrl}/dev_space${p['user_id'] ? `?user_id=${p['user_id']}` : ''}`;
    }
    if (resource === 'myDevSpace') {
        const hash = window.location.hash;
        const search = hash.substring(hash.indexOf('?'));
        const p = qs.parse(search);
        url = `${apiUrl}/dev_space${p['user_id'] ? `?user_id=${p['user_id']}` : ''}`;
    }

    return httpClient(url, options).then((result: Result) => {
        const listData = result.json.data;
        let list;
        try {
            if (resource === 'cluster') {
                list = listData && listData.map((l: Cluster) => deserializeCluster(l));
            } else if (resource === 'application') {
                list = listData && listData.map((l: Application) => deserializeApplication(l));
            } else {
                list = listData;
            }
        } catch (e) {
            console.error(e);
        }

        return {
            data: list ? list : [],
            total: list ? list.length : 0,
        };
    });
};

export default getList;
